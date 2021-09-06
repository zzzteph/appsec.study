<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUserLabVmsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('user_cloud_vms', function (Blueprint $table) {
            $table->id();
			$table->foreignId('user_id')->constrained();
			$table->string('template_id',255);
			$table->integer('lab_lesson_id');
			$table->foreignId('cloud_id')->constrained();
			$table->string('ip',32)->default("");
			$table->string('instance_id',512)->default("");
			$table->integer('progress')->default(0);
			$table->enum('type', ['lab', 'user'])->default('lab');
			$table->enum('status', ['todo','starting','running','tostop','stopping','terminated'])->default('todo');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('user_lab_vms');
    }
}
