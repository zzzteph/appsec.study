<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddQuestionType extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('lab_lesson_questions', function (Blueprint $table) {
			$table->dropColumn('type');
           $table->enum('type', ['yes', 'string','repeat'])->default('yes');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('lab_lesson_questions', function (Blueprint $table) {
            //
        });
    }
}
