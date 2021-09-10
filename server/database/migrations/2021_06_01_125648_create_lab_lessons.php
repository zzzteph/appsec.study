<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLabLessons extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('lab_lessons', function (Blueprint $table) {
            $table->id();
			$table->foreignId('vm_id')->constrained();
			$table->foreignId('lesson_id')->constrained()->onDelete('cascade');;
			$table->string('name',512);
			$table->text('content')->nullable();
			
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
        Schema::dropIfExists('lab_lessons');
    }
}
